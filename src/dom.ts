import {DOMWindow, JSDOM} from 'jsdom'

export const getDOM = (html: string): DOMWindow => {
  const {window} = new JSDOM(html)
  return window
}
