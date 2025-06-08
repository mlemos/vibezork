# VibeZork

VibeZork is a Electron application where the user will be able to play the Zork, text based adventure game, with the support of AI and with AI generated music and graphics.

# User Interface

The interface will be a simple full screen app with the following sections:

- VibeZork Panel : Divided in two parts, the top part will show the game graphics and the bottom part will show the game output.
- Input Panel : Where the user will type their commands.
- AI Panel: Where the AI will show its output.
- Controls Panel: Where the user will be able to control the app.
    - Reset Game
    - Play/Pause the AI player
    - Mute/Unmute the music
    - Change the graphics generation mode (basicaly channing the prompt used to generate the graphics)

# Architecture

## The Zork game
The Zork version well use is;
/opt/homebrew/bin/dfrotz ~/Downloads/zorkpack/zork1_sg.

It is a text based, terminal based, version of the game. 
Maybe we should encaposulate this in a simple web server and use it as a backend for the app.

## AI

We'll use AI in 3 different ways:

1) Generate the graphics of the game. Basically, after getting the game output, we'll send it to the AI to generate the graphics. And we'll present the graphics in the VibeZork Panel.

Let's make this simple. Just get the image generate and send it to the VibeZork Panel.

2) Play the game. Basically, after getting the game output, we'll send it to the AI to generate the music. And we'll present the music in the VibeZork Panel.

This is only if we ask the AI to play the game. If we want to play the game ourselves, we'll just use the Zork game as is.

If we have time, we'll try to add AI music generation.

3) Generate the music of the game. Basically, after getting the game output, we'll send it to the AI to generate the music. And we'll present the music in the VibeZork Panel.

