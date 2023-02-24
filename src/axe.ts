import axe, {Spec} from 'axe-core'

const getAxeConfig = (): Spec => {
  return {
    rules: [
      {
        id: 'color-contrast',
        enabled: false
      }
    ]
  }
}

const validate = (dom: Node): void => {
  axe.configure(getAxeConfig())
  axe.run(dom, function (err, results) {
    // eslint-disable-next-line no-console
    console.error('error', err)
    // eslint-disable-next-line no-console
    console.log('result', results)
  })
}

export default validate
