# Trakt.tv Ratings on Home Cards

Userscript for displaying episode, show, and movie ratings directly over cover images on the Trakt.tv home page.

## Preview

![Preview](https://github.com/amiad/TraktRatingsHome/blob/master/thumb.png?raw=true)

## Installation

1. Make sure you have a free, open-source userscript manager installed, such as **Violentmonkey**.
2. Install the script directly from [Greasy Fork](https://greasyfork.org/en/scripts/602631).
3. Open `https://app.trakt.tv/` and enjoy the ratings!

## Features

- **Seamless Integration:** Displays ratings as a clean badge over media cover cards.
- **Comprehensive Support:** Supports movies, TV shows, and individual episodes.
- **Smart Caching:** Uses `localStorage` with a 24-hour cache to minimize API requests and ensure instant loading.
- **Optimized Performance:** Built with a non-intrusive `MutationObserver` to dynamically handle infinite scrolling and UI changes.

## License

Licensed under the [GPL-3.0-or-later](LICENSE) license.