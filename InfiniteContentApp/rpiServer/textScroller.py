from rgbmatrix import RGBMatrix, RGBMatrixOptions, graphics
import time
import sys

options = RGBMatrixOptions()
options.rows = 32
options.cols = 64
options.chain_length = 7
options.gpio_slowdown = 4
options.pwm_bits =11
options.show_refresh_rate =True
options.brightness = 90
options.hardware_mapping="adafruit-hat-pwm"

matrix = RGBMatrix(options = options)

offscreen_canvas = matrix.CreateFrameCanvas()
font = graphics.Font()
font.LoadFont("/home/aidan/rpi-rgb-led-matrix/fonts/8x13.bdf")
textColor = graphics.Color(255, 255, 0)
#pos = offscreen_canvas.width
pos = 0
my_text = "Hello World"
print ("Matrix initialized")

if(len(sys.argv)>0):
    my_text = sys.argv[1]

while(True):
    offscreen_canvas.Clear()
    len = graphics.DrawText(offscreen_canvas, font, pos, 20, textColor, my_text)
    pos += 1
    if (pos + len > offscreen_canvas.width):
        #pos = offscreen_canvas.width
        pos=0

    time.sleep(0.05)
    offscreen_canvas = matrix.SwapOnVSync(offscreen_canvas)
    print("RUNNING TEXT")
	
print("PROGRAM FINISHED")
