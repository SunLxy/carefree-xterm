import React, { useEffect } from "react";
import Xterm, { SubscribeTerminalProvider, useSubscribeTerminals } from "carefree-xterm-web"
const Demo = () => {
  const sub = useSubscribeTerminals()
  useEffect(() => {
    console.log(sub)
  }, [sub])

  return <div>
    <Xterm id="2" cwd="/Users/lusun/Carefree/electron/carefree-electron" />
  </div>
}

const Index = () => {
  return <SubscribeTerminalProvider>
    <Demo />
  </SubscribeTerminalProvider>
}
export default Index