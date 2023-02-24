import {DOMWindow, JSDOM} from 'jsdom'

export const getDOM = async (html: string): Promise<DOMWindow> => {
  return new Promise(resolve => {
    const {window} = new JSDOM(html)
    resolve(window)
  })
}
