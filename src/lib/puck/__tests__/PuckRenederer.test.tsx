/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import { renderPuckToReactNodes, default as PuckRenderer } from '../PuckRenderer.server'

// --- mocks ----
jest.mock('../../cache', () => ({
  blockKey: (tenant: string, page: string, type: string) =>
    `${tenant}:${page}:${type}`,
  getRedisJSON: jest.fn()
}))

jest.mock('../componentRegistry.server', () => ({
  requireComponent: jest.fn()
}))

// sanitize-html just returns a string; spy to confirm call
jest.mock('sanitize-html', () => (html: string) => `SANITIZED:${html}`)

const { getRedisJSON } = require('../../cache')
const { requireComponent } = require('../componentRegistry.server')

function MockComp({ html, children }: any) {
  return (
    <div data-testid="mock">
      {html}
      {children}
    </div>
  )
}

describe('renderPuckToReactNodes', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    requireComponent.mockResolvedValue(MockComp)
  })

  test('renders simple nodes without cache', async () => {
    const puck = {
      content: [
        {
          type: 'Hero',
          props: {
            id: 'hero-1',
            html: '<b>test</b>'
          }
        }
      ]
    }

    getRedisJSON.mockResolvedValue(null)

    const nodes = await renderPuckToReactNodes(puck as any, 't', 'ph')
    const { container } = render(<div>{nodes}</div>)

    expect(screen.getByTestId('mock')).toBeInTheDocument()
    expect(screen.getByTestId('mock')).toHaveTextContent('SANITIZED:<b>test</b>')
    expect(requireComponent).toHaveBeenCalledWith('Hero')

    expect(container).toMatchSnapshot()            // ⭐ snapshot

  })

  test('uses cached HTML if available', async () => {
    const puck = {
      content: [
        {
          type: 'Hero',
          props: { id: 'hero-1' }
        }
      ]
    }

    getRedisJSON.mockResolvedValue({
      html: '<p>cached</p>'
    })

    const nodes = await renderPuckToReactNodes(puck as any, 'tenant', 'page')
    const { container } = render(<div data-testid="mock2">{nodes}</div>)

    const div = screen.getByTestId('mock2')
    expect(div.innerHTML).toBe('<div><p>cached</p></div>')
    expect(requireComponent).not.toHaveBeenCalled() // should skip

    expect(container).toMatchSnapshot()            // ⭐ snapshot

  })

  test('renders children recursively', async () => {
    const puck = {
      content: [
        {
          type: 'List',
          props: {
            id: 'list-1',
            items: [
              {
                type: 'Item',
                props: {
                  id: 'item-1',
                  html: '<i>child</i>'
                }
              }
            ]
          }
        }
      ]
    }

    getRedisJSON.mockResolvedValue(null)

    const nodes = await renderPuckToReactNodes(puck as any, 't', 'ph')
    const { container } = render(<div>{nodes}</div>)
    expect(requireComponent).toHaveBeenLastCalledWith('Item')
    expect(screen.getAllByTestId('mock')).toHaveLength(2)
    expect(screen.getByText('SANITIZED:<i>child</i>')).toBeInTheDocument()

    expect(container).toMatchSnapshot()            // ⭐ snapshot

  })
})

describe('PuckRenderer', () => {
  beforeEach(() => {
    requireComponent.mockResolvedValue(MockComp)
    getRedisJSON.mockResolvedValue(null)
  })

  test('wraps result in data-puck-root', async () => {
    const puck = {
      content: [
        {
          type: 'Test',
          props: { id: 'x' }
        }
      ]
    }

    const { container } = render(
      await PuckRenderer({
        puckJson: puck,
        tenantSlug: 'ts',
        pageHash: 'ph'
      }) as any
    )

    const root = screen.getByTestId
      ? screen.getByTestId('mock').closest('[data-puck-root]')
      : document.querySelector('[data-puck-root]')

    expect(container).toMatchSnapshot()            // ⭐ snapshot

    expect(root).toBeInTheDocument()
  })
})
