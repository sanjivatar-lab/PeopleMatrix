import { useRef, useState } from 'react'
import {
  Alert, Box, Button, Chip, LinearProgress, Paper, Stack, Typography,
} from '@mui/material'
import { CloudUpload, Download } from '@mui/icons-material'
import { employeeService } from '../services/employeeService'

export default function BulkUpload() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ created: number; updated: number; errors: string[] } | null>(null)
  const [error, setError] = useState('')

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) { setFile(f); setResult(null); setError('') }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) { setFile(f); setResult(null); setError('') }
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true); setError('')
    try {
      const res = await employeeService.bulkUpload(file)
      setResult(res)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const downloadTemplate = () => {
    const csv = [
      'first_name,last_name,email,mobile_number,native_place,years_of_experience,blood_group',
      'Alice,Smith,alice.smith@acme.com,9876543210,Mumbai,5,B+',
      'Bob,Jones,bob.jones@acme.com,,Delhi,3.5,O+',
    ].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url; a.download = 'employee_template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>Bulk Upload Employees</Typography>

      <Paper sx={{ p: 3, mb: 3, maxWidth: 700 }}>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Upload an <strong>.xlsx</strong> or <strong>.csv</strong> file. Existing employees (matched by
          email) will be updated; new ones will be created.
        </Typography>

        <Button
          variant="outlined" size="small" startIcon={<Download />}
          onClick={downloadTemplate} sx={{ mb: 3 }}
        >
          Download CSV Template
        </Button>

        <Box
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          sx={{
            border: '2px dashed',
            borderColor: file ? 'primary.main' : 'grey.400',
            borderRadius: 2,
            p: 5,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: file ? 'primary.50' : 'grey.50',
            transition: 'all .2s',
            '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' },
          }}
        >
          <CloudUpload sx={{ fontSize: 52, color: file ? 'primary.main' : 'text.disabled', mb: 1 }} />
          <Typography color={file ? 'primary.main' : 'text.secondary'} fontWeight={file ? 600 : 400}>
            {file ? file.name : 'Click or drag & drop your file here'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Supported: .xlsx, .csv
          </Typography>
          <input ref={inputRef} type="file" accept=".xlsx,.csv" hidden onChange={handleFile} />
        </Box>

        {uploading && <LinearProgress sx={{ mt: 2 }} />}

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        <Button
          variant="contained" startIcon={<CloudUpload />}
          disabled={!file || uploading}
          onClick={handleUpload}
          sx={{ mt: 2 }}
        >
          Upload
        </Button>
      </Paper>

      {result && (
        <Paper sx={{ p: 3, maxWidth: 700 }}>
          <Typography variant="h6" mb={2}>Upload Results</Typography>
          <Stack direction="row" spacing={2} mb={2}>
            <Chip label={`${result.created} created`} color="success" />
            <Chip label={`${result.updated} updated`} color="info" />
            {result.errors.length > 0 && (
              <Chip label={`${result.errors.length} errors`} color="error" />
            )}
          </Stack>
          {result.errors.map((msg, i) => (
            <Alert key={i} severity="warning" sx={{ mb: 1 }}>
              {msg}
            </Alert>
          ))}
        </Paper>
      )}
    </Box>
  )
}
