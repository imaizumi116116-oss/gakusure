import { fetchVideos, DEFAULT_QUERY } from './api.js';
import { renderSkeletons, renderStatus, renderVideos, updatePagination } from './ui.js';
import { isValidVideoId } from './utils.js';

const elements = {
  form: document.getElementById('search-form'),
  input: document.getElementById('query'),
  grid: document.getElementById('grid'),
  status: document.getElementById('status'),
  prevButton: document.getElementById('prev-btn'),
  nextButton: document.getElementById('next-btn'),
  pageInfo: document.getElementById('page-info'),
  modal: document.getElementById('video-modal'),
  modalBody: document.getElementById('modal-body'),
  modalTitle: document.getElementById('modal-title')
};

const state = {
  query: DEFAULT_QUERY,
  nextPageToken: '',
  prevPageToken: '',
  totalResults: 0,
  loading: false,
  error: null
};

let lastFocusedElement = null;

const focusableSelector = [
  'button',
  '[href]',
  'input',
  'select',
  'textarea',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

const getModalFocusable = () =>
  Array.from(elements.modal.querySelectorAll(focusableSelector)).filter(
    (el) => !el.disabled && el.offsetParent !== null
  );

const openModal = ({ videoId, title }) => {
  if (!isValidVideoId(videoId)) {
    renderStatus(elements.status, {
      message: 'Invalid video ID detected. Please try another result.',
      tone: 'error'
    });
    return;
  }

  lastFocusedElement = document.activeElement;
  elements.modalTitle.textContent = title || 'Now Playing';
  elements.modalBody.innerHTML = '';

  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube.com/embed/${videoId}`;
  iframe.title = title || 'YouTube video player';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.allowFullscreen = true;
  elements.modalBody.append(iframe);

  elements.modal.hidden = false;
  elements.modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');

  const focusable = getModalFocusable();
  if (focusable.length) {
    focusable[0].focus();
  }
};

const closeModal = () => {
  elements.modal.hidden = true;
  elements.modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  elements.modalBody.innerHTML = '';

  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
};

const trapFocus = (event) => {
  if (event.key !== 'Tab' || elements.modal.hidden) return;
  const focusable = getModalFocusable();
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

const handleModalKeydown = (event) => {
  if (event.key === 'Escape' && !elements.modal.hidden) {
    closeModal();
    return;
  }
  trapFocus(event);
};

const mapErrorMessage = (error) => {
  if (!error) return '';
  if (error.code === 'missing_key') {
    return 'API key is missing. Add VITE_YT_API_KEY to your .env file.';
  }
  if (error.code === 'quota') {
    return 'Quota exceeded. Please wait and try again later.';
  }
  if (error.code === 'key') {
    return 'API key is invalid or not configured for YouTube Data API.';
  }
  if (error.code === 'network') {
    return 'Network error. Check your connection and try again.';
  }
  return 'Something went wrong. Please try again.';
};

const loadVideos = async ({ query, pageToken = '' }) => {
  state.loading = true;
  state.error = null;
  renderStatus(elements.status, { message: 'Loading videos…' });
  renderSkeletons(elements.grid);
  updatePagination({
    prevButton: elements.prevButton,
    nextButton: elements.nextButton,
    infoEl: elements.pageInfo,
    prevToken: '',
    nextToken: '',
    query,
    totalResults: 0
  });

  try {
    const data = await fetchVideos({ query, pageToken });
    const items = Array.isArray(data.items) ? data.items : [];

    state.query = query;
    state.nextPageToken = data.nextPageToken || '';
    state.prevPageToken = data.prevPageToken || '';
    state.totalResults = data?.pageInfo?.totalResults || 0;
    state.loading = false;

    if (!items.length) {
      renderStatus(elements.status, {
        message: `No results found for "${query}".`,
        tone: 'error'
      });
      elements.grid.innerHTML = '';
    } else {
      renderStatus(elements.status, {
        message: `Showing results for "${query}".`
      });
      renderVideos(elements.grid, items, openModal);
    }

    updatePagination({
      prevButton: elements.prevButton,
      nextButton: elements.nextButton,
      infoEl: elements.pageInfo,
      prevToken: state.prevPageToken,
      nextToken: state.nextPageToken,
      query: state.query,
      totalResults: state.totalResults
    });
  } catch (error) {
    state.loading = false;
    state.error = error;
    renderStatus(elements.status, {
      message: mapErrorMessage(error),
      tone: 'error'
    });
    elements.grid.innerHTML = '';
    updatePagination({
      prevButton: elements.prevButton,
      nextButton: elements.nextButton,
      infoEl: elements.pageInfo,
      prevToken: '',
      nextToken: '',
      query,
      totalResults: 0
    });
  }
};

const handleSearch = (event) => {
  event.preventDefault();
  const query = elements.input.value.trim();
  if (!query) {
    renderStatus(elements.status, {
      message: 'Please enter a search term.',
      tone: 'error'
    });
    return;
  }
  loadVideos({ query });
};

const handlePageChange = (direction) => {
  const token = direction === 'next' ? state.nextPageToken : state.prevPageToken;
  if (!token) return;
  loadVideos({ query: state.query, pageToken: token });
};

const init = () => {
  elements.input.value = DEFAULT_QUERY;
  elements.form.addEventListener('submit', handleSearch);
  elements.prevButton.addEventListener('click', () => handlePageChange('prev'));
  elements.nextButton.addEventListener('click', () => handlePageChange('next'));

  elements.modal.addEventListener('click', (event) => {
    if (event.target.closest('[data-close="true"]')) {
      closeModal();
    }
  });
  elements.modal.addEventListener('keydown', handleModalKeydown);
  document.addEventListener('keydown', handleModalKeydown);

  loadVideos({ query: DEFAULT_QUERY });
};

init();
