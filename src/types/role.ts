

export default interface Role {
    code: string
    id: number
    name: string
    specs: string[]
    spec_ids?: number[]
    metrics: string[]
    playable: boolean
    icon_path: string

}
