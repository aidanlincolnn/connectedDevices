#!/usr/bin/env python3

import logging
import os
import dbus
import dbus.exceptions
import dbus.mainloop.glib
import dbus.service

from ble import (
    Advertisement,
    Characteristic,
    Service,
    Application,
    find_adapter,
    Descriptor,
    Agent,
)

from subprocess import check_output

import struct
import requests
import array
from enum import Enum

import sys

MainLoop = None
try:
    from gi.repository import GLib

    MainLoop = GLib.MainLoop
except ImportError:
    import gobject as GObject

    MainLoop = GObject.MainLoop

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
logHandler = logging.StreamHandler()
filelogHandler = logging.FileHandler("logs.log")
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logHandler.setFormatter(formatter)
filelogHandler.setFormatter(formatter)
logger.addHandler(filelogHandler)
logger.addHandler(logHandler)

mainloop = None

BLUEZ_SERVICE_NAME = "org.bluez"
GATT_MANAGER_IFACE = "org.bluez.GattManager1"
LE_ADVERTISEMENT_IFACE = "org.bluez.LEAdvertisement1"
LE_ADVERTISING_MANAGER_IFACE = "org.bluez.LEAdvertisingManager1"

class SharedParameters():
    def __init__(self):
        self.wifiPassword = "Input Wifi Password"
        self.wifiName = "Input Wifi Name"
    
    def CreateWifiConfig(self):
        print("setting wif config with")
        print(self.wifiPassword)
        print(self.wifiName)
        config_lines = [
            'network={',
            '\tssid="{}"'.format(self.wifiName),
            '\tpsk="{}"'.format(self.wifiPassword),
            '\tkey_mgmt=WPA-PSK',
            '}',
            '\n'
        ]

        config = '\n'.join(config_lines)
        print(config)

        fileName = '/etc/wpa_supplicant/wpa_supplicant.conf'
        with open(fileName,'r') as f:
            with open('newfile.txt','w') as f2:
                oldConfig = f.readlines()
                if(len(oldConfig) > 4):
                    f2.write(oldConfig[0])
                    f2.write(oldConfig[1])
                    f2.write(oldConfig[2])
                    f2.write(oldConfig[3])
                f2.write(config) 
                for i in range(4,len(oldConfig)):
                    f2.write(oldConfig[i])
                f2.close()
            f.close()
        os.rename('newfile.txt',fileName)
    
    def Reboot(self):
        os.system('sudo reboot now')

class InvalidArgsException(dbus.exceptions.DBusException):
    _dbus_error_name = "org.freedesktop.DBus.Error.InvalidArgs"


class NotSupportedException(dbus.exceptions.DBusException):
    _dbus_error_name = "org.bluez.Error.NotSupported"


class NotPermittedException(dbus.exceptions.DBusException):
    _dbus_error_name = "org.bluez.Error.NotPermitted"


class InvalidValueLengthException(dbus.exceptions.DBusException):
    _dbus_error_name = "org.bluez.Error.InvalidValueLength"


class FailedException(dbus.exceptions.DBusException):
    _dbus_error_name = "org.bluez.Error.Failed"


def register_app_cb():
    logger.info("GATT application registered")


def register_app_error_cb(error):
    logger.critical("Failed to register application: " + str(error))
    mainloop.quit()



class peachWifiService(Service):
    """
    BLE Service that updates the wpa supplicant file with a new entry for wifi (currently appends file)
    Future state should overwrite file / append to start of file to add whichever wifi they just added as the default preference

    """
    PEACHWIFISVC_UUID = "12634d99-d598-4874-8e86-7d042ee07ba7"

    def __init__(self, bus, index):
        params = SharedParameters()
        Service.__init__(self, bus, index, self.PEACHWIFISVC_UUID, True)
        self.add_characteristic(RouterName(bus, 0, self,params))
        self.add_characteristic(RouterPassword(bus, 1, self,params))
        self.add_characteristic(RebootRaspberryPi(bus,2,self,params))
        self.add_characteristic(CheckWifiStatus(bus,3,self,params))


class RouterName(Characteristic):
    uuid = "4116f8d2-9f66-4f58-a53d-fc7440e7c14e"
    description = b"SET YOUR WIFI ROUTER NAME"
    
    
    def __init__(self, bus, index, service, params):
        Characteristic.__init__(
            self, bus, index, self.uuid, ["encrypt-read", "encrypt-write"], service,
        )
        self.params = params
        self.value = [0xFF]
        self.add_descriptor(CharacteristicUserDescriptionDescriptor(bus, 1, self))
       

    def ReadValue(self, options):
        print(self.params.wifiName)
        try:
            self.value = bytearray(self.params.wifiName, encoding="utf8")
        except Exception as e:
            logger.error(f"Error getting wifi router name {e}")
        return self.value

    def WriteValue(self, value, options):
        logger.debug("wifi router write: " + repr(value))
        self.params.wifiName = bytes(value).decode("utf-8")
        print("wifi name written:")
        print(self.params.wifiName)

class RouterPassword(Characteristic):
    uuid = "4116f8d3-9f66-4f58-a53d-fc7440e7c14e"
    description = b"SET YOUR WIFI ROUTER PASSWORD"

    def __init__(self, bus, index, service, params):
        Characteristic.__init__(
            self, bus, index, self.uuid, ["encrypt-read", "encrypt-write"], service,
        )

        self.params = params
        self.value = [0xFF]
        self.add_descriptor(CharacteristicUserDescriptionDescriptor(bus, 1, self))

    def ReadValue(self, options):
        try:
            self.value = bytearray(self.params.wifiPassword, encoding="utf8")
        except Exception as e:
            logger.error(f"Error getting wifi router password {e}")
        return self.value

    def WriteValue(self, value, options):
        logger.debug("wifi password write: " + repr(value))
        self.params.wifiPassword = bytes(value).decode("utf-8")
        print("wifi pass written:")
        print(self.params.wifiPassword)
        

class RebootRaspberryPi(Characteristic):
    uuid = "4116f8d4-9f66-4f58-a53d-fc7440e7c14e"
    description = b"SEND 1 TO REBOOT Rpi AFTER ADDING WIFI"

    def __init__(self, bus, index, service, params):
        Characteristic.__init__(
            self, bus, index, self.uuid, ["encrypt-read", "encrypt-write"], service,
        )

        self.params = params
        self.value = [0xFF]
        self.add_descriptor(CharacteristicUserDescriptionDescriptor(bus, 1, self))

    def ReadValue(self, options):
        try:
            self.value = bytearray("SEND A 1 TO REBOOT RPi AFTER ADDING WIFI NAME AND PASS", encoding="utf8")
        except Exception as e:
            logger.error(f"Error getting reboot read value {e}")
        return self.value

    def WriteValue(self, value, options):
        logger.debug("reboot write: " + repr(value))
        rebootValue = bytes(value).decode("utf-8")
        
        print("value written to reboot:")
        print(rebootValue)
        if(rebootValue == '1'):
            self.params.CreateWifiConfig()
            self.params.Reboot()

class CheckWifiStatus(Characteristic):
    uuid = "4116f8d5-9f66-4f58-a53d-fc7440e7c14e"
    description = b"SENDS WIFI STATUS (Connected Or Not Connected)"

    def __init__(self, bus, index, service, params):
        Characteristic.__init__(
            self, bus, index, self.uuid, ["encrypt-read"], service,
        )

        self.params = params
        self.value = [0xFF]
        self.add_descriptor(CharacteristicUserDescriptionDescriptor(bus, 1, self))

    def ReadValue(self, options):
        wifi_ip = check_output(['hostname', '-I'])
        status = "Disconnected"
        if wifi_ip is not None:
            status = "Connected"
        try:
            self.value = bytearray(status, encoding="utf8")
        except Exception as e:
            logger.error(f"Error getting wifi status read value {e}")
        return self.value


class CharacteristicUserDescriptionDescriptor(Descriptor):
    """
    Writable CUD descriptor.
    """

    CUD_UUID = "2901"

    def __init__(
        self, bus, index, characteristic,
    ):

        self.value = array.array("B", characteristic.description)
        self.value = self.value.tolist()
        Descriptor.__init__(self, bus, index, self.CUD_UUID, ["read"], characteristic)

    def ReadValue(self, options):
        return self.value

    def WriteValue(self, value, options):
        if not self.writable:
            raise NotPermittedException()
        self.value = value


class PeachWIFIAdvertisement(Advertisement):
    def __init__(self, bus, index):
        Advertisement.__init__(self, bus, index, "peripheral")
        self.add_manufacturer_data(
            0xFFFF, [0x70, 0x74],
        )
        self.add_service_uuid(peachWifiService.PEACHWIFISVC_UUID)

        self.add_local_name("InfiniteContent")
        self.include_tx_power = True


def register_ad_cb():
    logger.info("Advertisement registered")


def register_ad_error_cb(error):
    logger.critical("Failed to register advertisement: " + str(error))
    mainloop.quit()


AGENT_PATH = "/com/punchthrough/agent"


def main():
    global mainloop

    dbus.mainloop.glib.DBusGMainLoop(set_as_default=True)

    # get the system bus
    bus = dbus.SystemBus()
    # get the ble controller
    adapter = find_adapter(bus)

    if not adapter:
        logger.critical("GattManager1 interface not found")
        return

    adapter_obj = bus.get_object(BLUEZ_SERVICE_NAME, adapter)

    adapter_props = dbus.Interface(adapter_obj, "org.freedesktop.DBus.Properties")

    # powered property on the controller to on
    adapter_props.Set("org.bluez.Adapter1", "Powered", dbus.Boolean(1))

    # Get manager objs
    service_manager = dbus.Interface(adapter_obj, GATT_MANAGER_IFACE)
    ad_manager = dbus.Interface(adapter_obj, LE_ADVERTISING_MANAGER_IFACE)

    advertisement = PeachWIFIAdvertisement(bus, 0)
    obj = bus.get_object(BLUEZ_SERVICE_NAME, "/org/bluez")

    #agent = Agent(bus, AGENT_PATH)

    app = Application(bus)
    app.add_service(peachWifiService(bus, 2))

    mainloop = MainLoop()
    #agent_manager = dbus.Interface(obj, "org.bluez.AgentManager1")
    #agent_manager.RegisterAgent(AGENT_PATH, "NoInputNoOutput")

    ad_manager.RegisterAdvertisement(
        advertisement.get_path(),
        {},
        reply_handler=register_ad_cb,
        error_handler=register_ad_error_cb,
    )

    logger.info("Registering GATT application...")

    service_manager.RegisterApplication(
        app.get_path(),
        {},
        reply_handler=register_app_cb,
        error_handler=[register_app_error_cb],
    )

    #agent_manager.RequestDefaultAgent(AGENT_PATH)

    mainloop.run()
    # ad_manager.UnregisterAdvertisement(advertisement)
    # dbus.service.Object.remove_from_connection(advertisement)



if __name__ == "__main__":
    main()
