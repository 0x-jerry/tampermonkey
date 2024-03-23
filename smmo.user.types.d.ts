export interface Page {
  /**
   * Check if in this page.
   */
  check(): boolean
  actions: Action[]
}


export interface Action {
  name:string
  priority: number

  /**
   * Is this action should be executed
   */
  check(): boolean

  action(): any
}
