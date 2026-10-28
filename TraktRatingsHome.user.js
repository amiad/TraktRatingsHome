// ==UserScript==
// @name         Trakt.tv Ratings on Home Cards
// @namespace    TraktRatingsHome
// @version      7.8
// @description  Display episode, show, and movie ratings over cover images on Trakt.tv home page.
// @author       You
// @match        https://app.trakt.tv/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-idle
// @license      GPL-3.0-or-later
// @icon         https://github.com/amiad/TraktRatingsHome/blob/master/star.png?raw=true
// ==/UserScript==

(function () {
    'use strict';

    const CACHE_TTL = 24 * 60 * 60 * 1000;
    const TRAKT_CLIENT_ID = '201dc70c5ec6af530f12f079ea1922733f6e1085ad7b02f36d8e011b75bcea7d';

    function getCardMediaInfo(card) {
        const episodeLink = card.querySelector('a[href*="view=episode"]');
        if (episodeLink) {
            const showMatch = episodeLink.href.match(/\/shows\/([^\?\/]+)/);
            const seasonMatch = episodeLink.href.match(/season=([0-9]+)/);
            const episodeMatch = episodeLink.href.match(/episode=([0-9]+)/);

            if (showMatch && seasonMatch && episodeMatch) {
                return {
                    type: 'episode',
                    slug: showMatch[1],
                    season: seasonMatch[1],
                    episode: episodeMatch[1]
                };
            }
        }

        const mediaLink = card.querySelector('a[href*="/shows/"], a[href*="/movies/"]');
        if (mediaLink) {
            const showMatch = mediaLink.href.match(/\/shows\/([^\?\/]+)/);
            if (showMatch) {
                return { type: 'show', slug: showMatch[1] };
            }

            const movieMatch = mediaLink.href.match(/\/movies\/([^\?\/]+)/);
            if (movieMatch) {
                return { type: 'movie', slug: movieMatch[1] };
            }
        }

        return null;
    }

    async function fetchRating(mediaInfo) {
        let apiUrl = '';
        let cacheKey = '';

        if (mediaInfo.type === 'episode') {
            cacheKey = `trakt_api_ep_${mediaInfo.slug}_s${mediaInfo.season}e${mediaInfo.episode}`;
            apiUrl = `https://api.trakt.tv/shows/${mediaInfo.slug}/seasons/${mediaInfo.season}/episodes/${mediaInfo.episode}/ratings`;
        } else if (mediaInfo.type === 'show') {
            cacheKey = `trakt_api_show_${mediaInfo.slug}`;
            apiUrl = `https://api.trakt.tv/shows/${mediaInfo.slug}/ratings`;
        } else if (mediaInfo.type === 'movie') {
            cacheKey = `trakt_api_mov_${mediaInfo.slug}`;
            apiUrl = `https://api.trakt.tv/movies/${mediaInfo.slug}/ratings`;
        }

        if (!apiUrl) return null;

        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
            try {
                const parsed = JSON.parse(cachedData);
                if (Date.now() - parsed.timestamp < CACHE_TTL) {
                    return parsed.rating;
                }
            } catch (e) {}
        }

        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: apiUrl,
                headers: {
                    'Content-Type': 'application/json',
                    'trakt-api-version': '2',
                    'trakt-api-key': TRAKT_CLIENT_ID
                },
                onload: function (response) {
                    if (response.status === 200) {
                        try {
                            const data = JSON.parse(response.responseText);
                            if (data && typeof data.rating === 'number' && data.rating > 0) {
                                const percentage = Math.round(data.rating * 10);
                                const ratingStr = `${percentage}%`;

                                localStorage.setItem(cacheKey, JSON.stringify({
                                    rating: ratingStr,
                                    timestamp: Date.now()
                                }));
                                resolve(ratingStr);
                                return;
                            }
                        } catch (e) {}
                    }
                    resolve(null);
                },
                onerror: function () {
                    resolve(null);
                }
            });
        });
    }

    async function processCards() {
        const cards = document.querySelectorAll('.trakt-card');

        for (const card of cards) {
            if (card.dataset.ratingProcessed) continue;

            const sectionHeader = card.closest('div, section')?.querySelector('h1, h2, h3, h4');
            if (sectionHeader && sectionHeader.textContent.trim().toLowerCase().startsWith('calendar')) {
                continue;
            }

            const mediaInfo = getCardMediaInfo(card);
            if (!mediaInfo) continue;

            card.dataset.ratingProcessed = "true";

            const rating = await fetchRating(mediaInfo);
            if (rating) {
                const cover = card.querySelector('.trakt-card-cover');
                if (!cover) continue;

                const existingBadge = card.querySelector('.trakt-custom-rating-badge');
                if (existingBadge) existingBadge.remove();

                const badge = document.createElement('div');
                badge.className = 'trakt-custom-rating-badge';
                badge.innerHTML = `★ ${rating}`;
                badge.style.cssText = `
                    position: absolute;
                    top: 8px;
                    left: 8px;
                    background: var(--purple-700, oklch(43% .1681 289));
                    color: #fff;
                    font-weight: bold;
                    font-size: 12px;
                    padding: 3px 7px;
                    border-radius: 4px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.5);
                    z-index: 20;
                    pointer-events: none;
                `;

                if (getComputedStyle(cover).position === 'static') {
                    cover.style.position = 'relative';
                }

                cover.appendChild(badge);
            }
        }
    }

    const observer = new MutationObserver(() => {
        processCards();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    processCards();
})();
