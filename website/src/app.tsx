import Xterm, { SubscribeTerminalProvider, useSubscribeTerminals } from "carefree-xterm-web"
const Demo = () => {
  const sub = useSubscribeTerminals()

  const a = () => {
    console.log(2121, sub.getTerminal("2"), sub)
  }

  return <div>
    <button onClick={a} >点击</button>
    <Xterm id="2" isAutoLink={true} cwd="/Users/lusun/Carefree/electron/carefree-electron" />
  </div>
}

const Index = () => {
  return <SubscribeTerminalProvider>
    <Demo />
  </SubscribeTerminalProvider>
}
export default Index