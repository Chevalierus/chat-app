import { getServerSession } from 'next-auth'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import React, { FC } from 'react'
import { Icon, Icons } from '../../components/Icons'
import { authOptions } from '../../lib/auth'
import SignOutButton from '../../components/SignOutButton'
import FriendRequestSidebarOption from '../../components/FriendRequestSidebarOption'
import { fetchRedis } from '../../helpers/redis'
import { getFriendsByUserId } from '../../helpers/get-friends-by-user-id'
import SidebarChatList from '../../components/SidebarChatList'
import MobileChatLayout from '../../components/MobileChatLayout'

interface LayoutProps {
  children: React.ReactNode
}

interface SidebarOption {
  id: number,
  name: string,
  href: string,
  Icon: Icon
}

const sidebarOptions: SidebarOption[] = [
  {
    id: 1,
    name: 'Add friend',
    href: '/dashboard/add',
    Icon: 'UserPlus',
  }
]

const layout = async ({children}: LayoutProps) => {
  const session = await getServerSession(authOptions)
  if(!session) notFound()

  const friends = await getFriendsByUserId(session.user.id)

  const unseenRequests = (await fetchRedis('smembers', `user:${session.user.id}:incoming_friends_request`) as User[]).length
  
return <div className="w-full flex h-screen">
  <div className="md:hidden">
    <MobileChatLayout friends={friends} session={session} unseenRequestCount={unseenRequests} sidebarOptions={sidebarOptions}/>
  </div>

  <div className="hidden md:flex h-full w-full max-w-xs grow flex-col overflow-y-auto gap-y-5 border-r border-gray-200 bg-white px-6">
    <Link href="/dashboard" className="flex h-16 shrink-0 items-center">
      <Icons.Logo className="h-8 w-auto text-indigo-600"></Icons.Logo>
    </Link>

  {friends.length > 0 ? (<div className="text-xs font-semibold leading-6 text-gray-400">Ваши чаты</div>) : null}

    <nav className="flex flex-1 flex-col">
      <ul role="list" className="flex flex-1 flex-col gap-y-7">
        <SidebarChatList sessionId={session.user.id} friends={friends}/>
        <li>
          <div className='text-xs font-semibold leading-6 text-gray-400'>Надсмотрщик</div>

          <ul role="list" className="-mx-2 mt-2 space-y-1">
          {sidebarOptions.map((el) => {
            const Icon = Icons[el.Icon]
            return(
              <li key={el.id}>
                <Link href={el.href} className="text-gray-700 hover:text-indigo-700 hover:bg-gray-50 group flex gap-3 rounded-md p-2 text-sm leading-6 font-semibold">
                  <span className="text-gray-400 border-gray-200 group-hover:border-indigo-600 group-hover:text-indigo-600 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[0.625] font-medium bg-white">
                    <Icon className="h-4 w-4"></Icon>
                  </span>

                  <span className='truncate'>{el.name}</span>
                </Link>
              </li>
              )
            })}
            <li className="">
            <FriendRequestSidebarOption sessionId={session.user.id} initialUnseenRequests={unseenRequests}/>
          </li>
          </ul>
        </li>

        <li className="-mx-6 mt-auto flex items-center">
          <div className='flex flex-1 items-center gap-fx-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-900'>
            <div className="relative h-8 w-8 bg-gray-500">
              <Image fill referrerPolicy="no-referrer" className="rounded-full" src={session.user.image || ''} alt="Картинка вашего профиля"/>
            </div>

            <span className="sr-only">Ваш профиль</span>
            <div className="flex flex-col">
              <span aria-hidden="true">{session.user.name}</span>
              <span className="text-ss text-zinc-400" aria-hidden='true'>{session.user.email}</span>
            </div>
          </div>
          <SignOutButton className="h-full aspect-square"/>
        </li>
      </ul>
    </nav>
  </div>
  <aside className="max-h-screen container py-16 md:py-12 w-full">{children}</aside>
  </div>
}

export default layout