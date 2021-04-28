import os
import time
import datetime
from datetime import datetime
import logging
from logging import handlers


now = datetime.now()
theDate = now.strftime("%x")
theDate = theDate.replace("/","-")
theTime = now.strftime("%X")

logFileName = "/home/aidan/temperatureLogging/TempLog-"+theDate+"-"+theTime+".log"

rfh = logging.handlers.RotatingFileHandler(
 	filename=logFileName, 
  	mode='a',
  	maxBytes=20*1024*1024,
  	backupCount=2,
  	encoding=None,
  	delay=0
)

logging.basicConfig(
  	level=logging.INFO,
  	format="%(message)s",
    datefmt="%y-%m-%d %H:%M:%S",
    handlers=[
    	rfh
    ]
)

logger = logging.getLogger('main')

def measure_temp():
     temp = os.popen("vcgencmd measure_temp").readline()
     return (temp.replace("temp=",""))

while True:
     now = datetime.now()
     now = now.strftime("%c")
     logging.info(str(now)+" Temperature Log: "+str(measure_temp()))
     #measure temperature every 5 minutes and print to log file
     time.sleep(300)

