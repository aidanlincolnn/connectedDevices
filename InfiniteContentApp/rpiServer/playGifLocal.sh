#!/bin/bash
imageViewer=/home/aidan/rpi-rgb-led-matrix/utils/led-image-viewer
rows=32
cols=64
mapping=adafruit-hat-pwm
slowdown=4
chain=7
brightness=95
refresh=100


sudo $imageViewer $1 --led-rows=$rows --led-cols=$cols --led-gpio-mapping=$mapping --led-slowdown-gpio=$slowdown --led-brightness=$brightness --led-chain=$chain --led-limit-refresh=$refresh --led-show-refresh
