import { Xterm, SubscribeTerminalsProvider, useSubscribeTerminals } from "carefree-xterm-web"
const Demo = () => {
  const sub = useSubscribeTerminals()

  const onClose = () => {
    const newSub = sub.getTerminal("2")
    console.log(2121, newSub)
    newSub.onCloseTerminal()
    // newSub.onCloseLink()
  }

  const onLink = () => {
    const newSub = sub.getTerminal("2")
    // newSub.createTerm(true)
    newSub.createWebTerminal()
    console.log(2121, newSub)
  }

  return <div>
    <button onClick={onClose} >关闭</button>
    <button onClick={onLink} >连接</button>
    <Xterm id="2" isAutoLink={true} cwd="/Users/lusun/CAREFRESS/carefree-xterm" />
  </div>
}

const Index = () => {
  return <SubscribeTerminalsProvider>
    <Demo />
  </SubscribeTerminalsProvider>
}
export default Index