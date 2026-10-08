import { lookupCustomer } from './customers'
import { apiClient } from './client'

jest.mock('./client', () => ({
  apiClient: { get: jest.fn() },
}))

const mockGet = apiClient.get as jest.Mock

describe('lookupCustomer', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns the customer when found', async () => {
    const customer = { id: 1, email: 'jane@example.com', first_name: 'Jane', last_name: 'Doe' }
    mockGet.mockResolvedValue({ data: customer })

    await expect(lookupCustomer(1, 'jane@example.com')).resolves.toEqual(customer)
  })

  it('returns null on a 404 (no match)', async () => {
    mockGet.mockRejectedValue({
      isAxiosError: true,
      response: { status: 404, data: { error: { message: 'No customer found with that email.' } } },
    })

    await expect(lookupCustomer(1, 'nobody@example.com')).resolves.toBeNull()
  })

  it('rethrows a non-404 error', async () => {
    const serverError = {
      isAxiosError: true,
      response: { status: 500, data: { error: { message: 'Internal server error' } } },
    }
    mockGet.mockRejectedValue(serverError)

    await expect(lookupCustomer(1, 'jane@example.com')).rejects.toBe(serverError)
  })
})
