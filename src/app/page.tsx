import React from 'react'
import { env } from '~/env'

export default function HomePage() {
  return (
    <div>{env.BETTER_AUTH_SECRET}</div>
  )
}
