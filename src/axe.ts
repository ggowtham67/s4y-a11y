import axe from 'axe-core'
import {AXE_CONFIG} from './const'

const validate = async (dom: Node): Promise<axe.AxeResults> => {
  return new Promise((resolve, reject) => {
    axe.configure(AXE_CONFIG)
    axe.run(dom, (e, r) => {
      if (!e) resolve(r)
      reject(e)
    })
  })
}

export default validate
