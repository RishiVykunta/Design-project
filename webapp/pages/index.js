import Head from 'next/head'
import { useState } from 'react'

export default function Home() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [message, setMessage] = useState('')

  const handleDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleChange = (e) => {
    const f = e.target.files[0]
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const upload = async () => {
    if (!file) return setMessage('Select a file first')
    const form = new FormData()
    form.append('image', file)
    setMessage('Uploading...')
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: form,
    })
    const data = await res.json()
    if (res.ok) {
      setMessage(`Uploaded! URL: ${data.url}`)
    } else {
      setMessage(`Error: ${data.error}`)
    }
  }

  return (
    <>
      <Head>
        <title>SIDA Image Upload</title>
      </Head>
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem' }}>
        <h1>SIDA – Drag & Drop Image</h1>
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          style={{
            border: '2px dashed #666',
            borderRadius: '12px',
            width: '300px',
            height: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}
        >
          {preview ? <img src={preview} alt="preview" style={{ maxWidth: '100%', maxHeight: '100%' }} /> : 'Drop image here'}
        </div>
        <input type="file" accept="image/*" onChange={handleChange} />
        <button onClick={upload} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
          Upload
        </button>
        <p>{message}</p>
      </main>
    </>
  )
}
