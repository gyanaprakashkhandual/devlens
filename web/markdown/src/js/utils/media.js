import { isYoutube, isVimeo, getYoutubeId, getVimeoId } from './parser/utils.js';

function processMedia(container) {
  processIframeLinks(container);
  wrapVideos(container);
  wrapAudios(container);
}

function processIframeLinks(container) {
  const paragraphs = container.querySelectorAll('p');
  paragraphs.forEach(p => {
    const text = p.textContent.trim();
    if (isYoutube(text)) {
      const id = getYoutubeId(text);
      if (id) {
        const wrapper = document.createElement('div');
        wrapper.className = 'embed-wrapper';
        wrapper.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}" title="YouTube video" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`;
        p.replaceWith(wrapper);
      }
    } else if (isVimeo(text)) {
      const id = getVimeoId(text);
      if (id) {
        const wrapper = document.createElement('div');
        wrapper.className = 'embed-wrapper';
        wrapper.innerHTML = `<iframe src="https://player.vimeo.com/video/${id}" title="Vimeo video" allowfullscreen></iframe>`;
        p.replaceWith(wrapper);
      }
    }
  });

  const links = container.querySelectorAll('a');
  links.forEach(a => {
    const href = a.href;
    const isAlone = a.parentElement.tagName === 'P' && a.parentElement.children.length === 1 && a.parentElement.textContent.trim() === a.textContent.trim();
    if (!isAlone) return;

    if (isYoutube(href)) {
      const id = getYoutubeId(href);
      if (id) {
        const wrapper = document.createElement('div');
        wrapper.className = 'embed-wrapper';
        wrapper.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}" title="YouTube video" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>`;
        a.parentElement.replaceWith(wrapper);
      }
    }
  });
}

function wrapVideos(container) {
  container.querySelectorAll('video').forEach(video => {
    if (video.parentElement.classList.contains('media-wrapper')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'media-wrapper';
    video.parentNode.insertBefore(wrapper, video);
    wrapper.appendChild(video);
    video.setAttribute('controls', '');
  });
}

function wrapAudios(container) {
  container.querySelectorAll('audio').forEach(audio => {
    if (audio.parentElement.classList.contains('media-wrapper')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'media-wrapper';
    audio.parentNode.insertBefore(wrapper, audio);
    wrapper.appendChild(audio);
    audio.setAttribute('controls', '');
  });
}

export { processMedia };