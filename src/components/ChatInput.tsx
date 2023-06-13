"use client"

import axios from 'axios'
import React, { useRef, useState } from 'react'
import { FC } from 'react'
import toast from 'react-hot-toast'
import TextareaAutosize from 'react-textarea-autosize'
import Button from './ui/Button'

interface ChatInputProps {
  chatPartner: User
  chatId: string
}

const ChatInput: FC<ChatInputProps> = ({chatPartner, chatId}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [input, setInput] = useState<string>("")
  const sendMessage = async () => {
    if(!input) return
    setIsLoading(true)

    try {
      await axios.post('/api/message/send', {text:input, chatId})
      setInput("")
      textareaRef.current?.focus()
    } catch (error) {
      toast.error("Что-то пошло не так, попробуйте еще раз!")
    } finally {
      setIsLoading(false)
    }
  }
   
  return <div className='border-t border-gray-300 px-4 pt-4 mb-2 sm:mb-0'>
    <div className="relative flex-1 overflow-hidden rounded-lg shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-indigo-600">
      <TextareaAutosize ref={textareaRef} onKeyDown={(e) => {
        if(e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          sendMessage()
        }
      }}  rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Сообщения для ${chatPartner.name}`}
          className="block w-full resize-none border-0 bg-transparent text-gray-900 placeholder:text-gray-500 focus:ring-0 sm:py-1.5 sm:text-sm sm:leading-6"/>

      <div onClick={() => textareaRef.current?.focus()} className="py-2" aria-hidden="true">
        <div className="py-px">
          <div className="h-9"/>
        </div>
      </div>

      <div className="absolute right-0 bottom-0 flex justify-between py-2 pl-3 pr-2">
        <div className='flex-shrink-0'>
          <Button isLoading={isLoading} onClick={sendMessage} type="submit">Отправить</Button>
        </div>
      </div>
    </div>
  </div>
}

export default ChatInput