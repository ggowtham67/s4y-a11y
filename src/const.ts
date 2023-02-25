import type {Spec} from 'axe-core'

export const AXE_CONFIG: Spec = {
  rules: [
    {
      id: 'color-contrast',
      enabled: false
    },
    {
      id: 'region',
      enabled: false
    }
  ]
}
