import { Spinner } from 'react-bootstrap'

export function LoadingState() {
  return (
    <div className="d-flex justify-content-center py-5">
      <Spinner animation="border" role="status" variant="primary" />
    </div>
  )
}

export function ErrorState({ message = 'Something went wrong. Please try again.' }: { message?: string }) {
  return <p className="text-danger text-center py-5 mb-0">{message}</p>
}
