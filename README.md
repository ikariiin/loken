Compile using,
```sh
tsc
```
To start the bot,
```sh
node dist/index.js BotToken
```

List of commands, for now: (likely to change soon)
1. join [voice channel|Music] - joins the specified voice channel, if nothing is specified it tries to find any channel named `Music`
2. play - accepts a search term or an youtube link for now
3. toggle - plays/pauses the track
4. exit - leaves the voice channel

All contributions are welcome.
In development.