'use client'

import axios, { AxiosError } from 'axios'
import React, { FC, useState } from 'react'
import { addFriendValidator } from '../lib/validations/add-friend'
import Button from './ui/Button'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from "@hookform/resolvers/zod"

interface AddFriendBtnProps {
  
}

type FormData = z.infer<typeof addFriendValidator>

const AddFriendBtn: FC<AddFriendBtnProps> = ({}) => {
  const [showSuccess, setShowSuccess] = useState<boolean>(false)
  const {
    register,
    handleSubmit,
    setError,
    formState: {errors}
  } = useForm<FormData>({
    resolver: zodResolver(addFriendValidator)
  })

  const addFriend = async (email: string) => {
    try {
      const validateEmail = addFriendValidator.parse({ email })
      await axios.post('/api/friends/add', {
        email: validateEmail
      })
      setShowSuccess(true)
    } catch(error) {
      if(error instanceof z.ZodError) {
        // @ts-ignore
        setError('email', {message: error.message})
        return
      }

      if(error instanceof AxiosError) {
        // @ts-ignore
        setError('email', {message: error.response?.data})
        return
      }
      // @ts-ignore
      setError('email', {message: 'Что-то пошло не так...'})
    }
  }

  const onSubmit = (data: FormData) => {
    addFriend(data.email)
  }

  return <form onSubmit={handleSubmit(onSubmit)} className="max-w-sm">
    <label htmlFor="email" className="block text-sm font-medium leading-6">Add a friend</label>

    <div className="mt-2 flex gap-4">
      <input {...register('email')} type="text" className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inst focus:ring-indigo-600 sm:text-sm"
      placeholder="you@example.com"/>
      <Button>Add a friend</Button>
    </div>
    <p className="mt-1 text-sm text-red-600">{errors.email?.message}</p>
    {showSuccess ? (
      <p className="mt-1 text-sm text-green-600">Запрос отправлен</p>
    ): null}
  </form>
}

export default AddFriendBtn