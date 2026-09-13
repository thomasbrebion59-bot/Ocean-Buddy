# Underwater photographs — September 2026

18 real photographs were added for 13 destinations: Amed, Apo Island, Bunaken, Cozumel, Komodo, Ari Atoll, Medes Islands, Ningaloo, Port-Cros, Raja Ampat, Ras Muhammad, Silfra and Tulamben.

Each image was visually reviewed. `gallery-sources.json` records the original Wikimedia Commons file, author, licence and download URL, with a French caption identifying the photographed place. The new Ari Atoll lead is recorded in `sources.json`; it replaces the former photograph from the Male area. No photographs from other destinations were substituted for these places.

The application exports WebP copies up to 1920 pixels on the longest side, with 480-pixel thumbnails. No generative alteration, retouching or removal of photographer signatures was applied. The CSS crop varies by viewport, with an “Image entière” control in the full-screen gallery. Captions describe photographs, not live wildlife sightings or current conditions.

Run `python3 scripts/build_photo_catalog.py` after updating metadata. It builds `photo-catalog.js` and `photos.html`, including the original and licence links. `spot-photos.js` selects the featured underwater view for diving/snorkeling while keeping the landscape available in the gallery and for other activities.
