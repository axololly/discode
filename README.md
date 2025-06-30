# Discode - Discord RPC Extension

![Dynamic JSON Badge](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgithub.com%2Faxololly%2Fdiscode%2Fraw%2Fmain%2Fpackage.json&query=%24.version&label=version&color=default)

I decided my very first use of Typescript and Visual Studio Code's API was going to be to remake the famed Code extensions that display editor info on your Discord profile through Discord's RPC feature.

Over the past three weeks, I put together this extension that:

- features over 1,600 assets
- can display information about the current:
    - folder
    - file
    - workspace
- can link to a GitHub repository
- includes support for when debugging
- has its own output tab when logging

### Setup

Open whatever release you want, and then take the produced `.vsix` and open it in Visual Studio Code. Right-click it and you'll see a "Install Extension VSIX". Click that, and then it'll set up everything you need.

To manually connect or disconnect, those are two things in the command pallete (Ctrl+Shift+P).

To customise the extension, open Settings (Ctrl+,) and search for "discode". This will let you customise from here.

### Undocumented

If there are parts of the setup that aren't really documented, do let me know. I'm not exactly that interested in decorating this project at the moment, so the most you'll get is comments in the code explaining what it does.