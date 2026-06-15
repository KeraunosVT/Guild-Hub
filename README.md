# Weapon legend

Place your weapon reference image here as `weapon-legend.png` (or .jpg).

It should show each Throne & Liberty weapon icon next to its name. When present,
it's sent to Gemini as the first image on every screenshot parse, so the model
can compare each scoreboard icon against a labeled reference — this is the single
biggest accuracy win for weapon detection.

If no legend file is present, screenshot reading still works using the text
descriptions in the prompt; weapons will just be a bit less reliable.

Override the path with the WEAPON_LEGEND_PATH env var if you store it elsewhere.
