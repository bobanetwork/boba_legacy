import turtle
from numpy import complex, array
import colorsys


def koch_curve(t, iterations, length, shortening_factor, angle):
  if iterations == 0:
    # t.left(angle)
    t.forward(length)
    # print(angle)

  else:
    for angle in [60, -120, 60, 0]:
        koch_curve(t, iterations - 1, length / shortening_factor, shortening_factor, angle)
        t.left(angle)

t = turtle.Turtle()
t.hideturtle()
t.penup()
t.setpos(-200, 0)
t.pendown()
t.speed(0)


# koch_curve(t, 7 , 400, 3, 0)
# t.penup()
# t.setpos(-200, -100)
# t.pendown()

t.fillcolor('green')

# start the filling color
t.begin_fill()
koch_curve(t, 3 , 400, 3, 0)
# t.penup()
t.setpos(t.pos()[0], -100)
# t.pendown()

t.penup()
t.setpos(-200, 0)
t.pendown()
t.setpos(-200, -100)


koch_curve(t, 2 , 400, 3, 0)


t.fillcolor('green')

# start the filling color
t.begin_fill()
# t.penup()
t.setpos(-200, -200)
# t.pendown()
koch_curve(t, 4 , 400, 3, 0)
# t.penup()
t.setpos(-200, -300)
# t.pendown()
koch_curve(t, 3 , 400, 3, 0)
# t.penup()
t.setpos(-200, -400)
# t.pendown()
koch_curve(t, 2 , 400, 3, 0)


turtle.mainloop()