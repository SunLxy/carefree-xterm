import Xterm, { SubscribeTerminalProvider, useSubscribeTerminals } from "carefree-xterm-web"
const Demo = () => {
  const sub = useSubscribeTerminals()

  const onClose = () => {
    const newSub = sub.getTerminal("2")
    console.log(2121, newSub)
    newSub.onCloseLink()
  }

  const onLink = () => {
    const newSub = sub.getTerminal("2")
    newSub.createTerm(true)
    console.log(2121, newSub)
  }

  return <div>
    <button onClick={onClose} >关闭</button>
    <button onClick={onLink} >连接</button>
    <Xterm id="2" isAutoLink={true} cwd="/Users/lusun/Carefree/carefree-antd" />
  </div>
}

const Index = () => {
  return <SubscribeTerminalProvider>
    <Demo />
  </SubscribeTerminalProvider>
}
export default Index