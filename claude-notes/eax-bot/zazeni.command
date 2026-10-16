#!/bin/bash
# Dvoklik na to datoteko zažene EAX bota v Terminalu. Ustaviš ga s Ctrl+C ali zapreš okno.
cd "$(dirname "$0")"
caffeinate -i python3 eax_bot.py
