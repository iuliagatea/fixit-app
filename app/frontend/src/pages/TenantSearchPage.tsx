import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Badge, Card, Col, Form, Pagination, Row } from 'react-bootstrap'
import { fetchCategories } from '../api/categories'
import { searchTenants } from '../api/tenantDirectory'
import { ErrorState, LoadingState } from '../components/AsyncState'
import { PageContainer } from '../components/PageContainer'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

const FILTER_DEBOUNCE_MS = 300

function ratingLabel(averageRating: number | null, reviewsCount: number): string {
  if (averageRating === null) return 'No reviews yet'

  return `${averageRating.toFixed(1)} ★ (${reviewsCount} review${reviewsCount === 1 ? '' : 's'})`
}

export function TenantSearchPage() {
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [page, setPage] = useState(1)
  const debouncedQuery = useDebouncedValue(query, FILTER_DEBOUNCE_MS)

  useEffect(() => {
    setPage(1)
  }, [debouncedQuery, categoryId])

  const { data: categories } = useQuery({
    queryKey: ['categories', 'tenant'],
    queryFn: () => fetchCategories('tenant'),
  })

  const searchQuery = useQuery({
    queryKey: ['tenant-search', debouncedQuery, categoryId, page],
    queryFn: () => searchTenants({ query: debouncedQuery || undefined, category_id: categoryId || undefined, page }),
  })

  return (
    <PageContainer maxWidth={900}>
      <h1 className="h3 mb-3">Find a provider</h1>

      <Card className="card-flat mb-3">
        <Card.Body>
          <Row className="g-3">
            <Col sm={8}>
              <Form.Group controlId="tenantSearchQuery">
                <Form.Label className="small text-secondary mb-1">Search</Form.Label>
                <Form.Control
                  placeholder="Name, description, keywords…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </Form.Group>
            </Col>
            <Col sm={4}>
              <Form.Group controlId="tenantSearchCategory">
                <Form.Label className="small text-secondary mb-1">Category</Form.Label>
                <Form.Select
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value ? Number(event.target.value) : '')}
                >
                  <option value="">All categories</option>
                  {(categories ?? []).map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {searchQuery.isLoading && <LoadingState />}
      {searchQuery.isError && <ErrorState message="Couldn't load search results." />}
      {searchQuery.data && searchQuery.data.tenants.length === 0 && (
        <p className="text-secondary text-center py-5 mb-0">No providers match your search.</p>
      )}
      {searchQuery.data &&
        searchQuery.data.tenants.map((tenant) => (
          <Card key={tenant.id} className="card-flat mb-3">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <Link to={`/tenants/${tenant.id}`} className="h5 mb-1 text-decoration-none">
                  {tenant.name}
                </Link>
                <span className="small text-secondary">{ratingLabel(tenant.average_rating, tenant.rated_reviews_count)}</span>
              </div>
              {tenant.categories.length > 0 && (
                <div className="mb-2">
                  {tenant.categories.map((category) => (
                    <Badge key={category.id} bg="secondary" className="me-1">
                      {category.name}
                    </Badge>
                  ))}
                </div>
              )}
              {tenant.description && <p className="text-secondary mb-0">{tenant.description}</p>}
            </Card.Body>
          </Card>
        ))}

      {searchQuery.data && searchQuery.data.meta.total_pages > 1 && (
        <Pagination>
          {Array.from({ length: searchQuery.data.meta.total_pages }, (_, i) => i + 1).map((pageNumber) => (
            <Pagination.Item key={pageNumber} active={pageNumber === page} onClick={() => setPage(pageNumber)}>
              {pageNumber}
            </Pagination.Item>
          ))}
        </Pagination>
      )}
    </PageContainer>
  )
}
