import { FC } from 'react'
import AddFriendBtn from '../../../components/AddFriendBtn'


const page: FC = ({}) => {
  return <main className="pt-8">
    <h1 className="font-bold text-5xl mb-8">Добавить друга</h1>
    <AddFriendBtn></AddFriendBtn>
  </main>
}

export default page