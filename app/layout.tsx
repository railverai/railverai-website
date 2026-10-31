import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'Railverai — Financial infrastructure for the AI era',description:'AI-native financial technology for connected business accounts, AI-assisted operations and permissioned agent payment workflows.',icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
