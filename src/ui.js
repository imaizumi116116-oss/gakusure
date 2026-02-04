import { createElement, formatDate, isValidVideoId } from './utils.js';

export const renderStatus = (container, { message = '', tone = 'default' } = {}) => {
  container.textContent = message;
  container.dataset.tone = tone;
  if (tone === 'error') {
    container.setAttribute('role', 'alert');
    container.setAttribute('aria-live', 'assertive');
  } else {
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
  }
};

export const renderSkeletons = (container, count = 12) => {
  container.innerHTML = '';
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i += 1) {
    const card = createElement('div', 'skeleton-card');
    const thumb = createElement('div', 'skeleton-thumb');
    const body = createElement('div', 'skeleton-body');
    const line1 = createElement('div', 'skeleton-line');
    const line2 = createElement('div', 'skeleton-line short');
    body.append(line1, line2);
    card.append(thumb, body);
    fragment.append(card);
  }

  container.append(fragment);
};

export const renderVideos = (container, items, onSelect) => {
  container.innerHTML = '';
  const fragment = document.createDocumentFragment();

  items.forEach((item) => {
    const videoId = item?.id?.videoId;
    if (!videoId || !isValidVideoId(videoId)) return;

    const title = item?.snippet?.title || 'Untitled';
    const channel = item?.snippet?.channelTitle || 'Unknown channel';
    const publishedAt = formatDate(item?.snippet?.publishedAt);
    const thumbnail = item?.snippet?.thumbnails?.medium?.url || item?.snippet?.thumbnails?.default?.url || '';

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'card';
    card.dataset.videoId = videoId;
    card.dataset.title = title;
    card.addEventListener('click', () => onSelect({ videoId, title }));

    const thumbWrap = createElement('div', 'card-thumb');
    if (thumbnail) {
      const img = document.createElement('img');
      img.src = thumbnail;
      img.alt = title;
      img.loading = 'lazy';
      thumbWrap.append(img);
    }

    const body = createElement('div', 'card-body');
    const heading = createElement('h3', 'card-title');
    heading.textContent = title;
    const meta = createElement('div', 'card-meta');
    const channelSpan = document.createElement('span');
    channelSpan.textContent = channel;
    const dateSpan = document.createElement('span');
    dateSpan.textContent = publishedAt;
    meta.append(channelSpan, dateSpan);
    body.append(heading, meta);

    card.append(thumbWrap, body);
    fragment.append(card);
  });

  container.append(fragment);
};

export const updatePagination = ({ prevButton, nextButton, infoEl, prevToken, nextToken, query, totalResults }) => {
  prevButton.disabled = !prevToken;
  nextButton.disabled = !nextToken;

  if (totalResults) {
    infoEl.textContent = `Total results for "${query}": ${totalResults.toLocaleString()}`;
  } else {
    infoEl.textContent = query ? `Results for "${query}"` : '';
  }
};
