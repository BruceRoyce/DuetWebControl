'use strict'

import iziToast from 'izitoast'
import 'izitoast/dist/css/iziToast.css'

import { displaySpeed } from './display.js'

import i18n from '../i18n'
import { OperationCancelledError } from '../utils/errors.js'
import { extractFileName } from '../utils/path.js'

const defaults = {
	layout: 2,
	transitionIn: 'fadeInLeft',
	transitionOut: 'fadeOutRight'
}

export function makeNotification(type, title, message = '', timeout) {
	// Prepare and show new toast
	const options = Object.assign({
		class: 'new-toast',
		title: title.replace(/\n/g, '<br/>'),
		message: message.replace(/\n/g, '<br/>')
	}, defaults);

	if (timeout !== undefined) {
		options.timeout = timeout;
	}

	switch (type) {
		case 'info':
			iziToast.info(options);
			break;
		case 'success':
			iziToast.success(options);
			break;
		case 'warning':
			iziToast.warning(options);
			break;
		case 'error':
			iziToast.error(options);
			break;
	}

	// Get the new toast instance (iziToast does not return it)
	const toast = document.querySelector('.new-toast');
	toast.classList.remove('new-toast');

	// Fix layout of the created toast (by default layout 2 toasts are too wide)
	if (message) {
		const messageElement = toast.querySelector('p.iziToast-message');
		messageElement.style.width = 'auto';
		messageElement.parentNode.insertBefore(document.createElement('br'), messageElement);
	}

	return {
		domElement: toast,
		hide() { iziToast.hide({}, toast); }
	}
}

export function makeFileTransferNotification(type, destination, cancelSource, num, count) {
	const filename = extractFileName(destination);

	// Prepare toast
	iziToast.info({
		class: 'file-transfer',
		title: (count ? `(${num}/${count}) ` : '') + i18n.t(`notification.${type}.title`, [filename, 0, 0]),
		message: i18n.t(`notification.${type}.message`),
		layout: 2,
		timeout: false,
		onClosing: () => cancelSource.cancel(new OperationCancelledError())
	});

	// Get it and fix up the layout
	const toast = document.querySelector('.file-transfer');
	toast.classList.remove('file-transfer');

	const messageElement = toast.querySelector('p.iziToast-message');
	messageElement.style.width = 'auto';
	messageElement.parentNode.insertBefore(document.createElement('br'), messageElement);

	// Get progress bar
	const title = toast.querySelector('strong.iziToast-title');
	const progressBar = toast.querySelector('div.iziToast-progressbar > div');
	progressBar.style.width = '0%';

	// Return object with enough info about it
	const startTime = new Date();
	return {
		domElement: toast,
		onProgress(e) {
			const uploadSpeed = e.loaded / (((new Date()) - startTime) / 1000), progress = (e.loaded / e.total) * 100;
			title.textContent = i18n.t(`notification.${type}.title`, [filename, displaySpeed(uploadSpeed), Math.round(progress)]);
			progressBar.style.width = progress.toFixed(1) + '%';
		},
		hide() {
			iziToast.hide({}, toast);
		}
	}
}

export function showMessage(message) {
	const options = Object.assign({
		title: i18n.t('notification.message'),
		message: message.replace(/\n/g, '<br/>'),
		timeout: false
	}, defaults);

	iziToast.info(options);
}

export default {
	install(Vue) {
		Vue.prototype.$makeNotification = makeNotification;
		Vue.prototype.$makeFileTransferNotification = makeFileTransferNotification;
		Vue.prototype.$showMessage = showMessage;
	},

	installStore(store) {
		// TODO: register for UI notification changes here
	}
}
