import { string } from '@recoiljs/refine'
import {
  fireEvent,
  Matcher,
  MatcherOptions,
  render,
  waitFor,
} from '@testing-library/react'
import mockRouter from 'next-router-mock'
import { JSXElementConstructor, ReactElement, ReactNode } from 'react'
import { act } from 'react-dom/test-utils'
import { atom, RecoilRoot, useRecoilState } from 'recoil'
import { syncEffect } from 'recoil-sync'

import { RecoilURLSyncJSONNext } from './RecoilURLSyncJSONNext'

jest.mock('next/router', () => require('next-router-mock'))

const App: React.FC<{ children: ReactNode }> = ({ children }) => (
  <RecoilRoot>
    <RecoilURLSyncJSONNext location={{ part: 'queryParams' }}>
      {children}
    </RecoilURLSyncJSONNext>
  </RecoilRoot>
)

describe('<RecoilURLSyncJSONNext />', () => {
  describe('no querystring', () => {
    const testStringState = atom<string>({
      key: 'atom1',
      default: 'Foo',
      effects: [syncEffect({ refine: string() })],
    })

    const Child = () => {
      const [foo, setFoo] = useRecoilState(testStringState)

      return (
        <div>
          <button data-testid="foo" onClick={() => setFoo((v) => v + 'Foo')}>
            {foo}
          </button>
        </div>
      )
    }

    describe('Initial Render', () => {
      let getByTestId: (
        id: Matcher,
        options?: MatcherOptions | undefined
      ) => HTMLElement

      beforeEach(() => {
        mockRouter.isReady = true
        mockRouter.setCurrentUrl('/')

        const screen = render(
          <App>
            <Child />
          </App>
        )
        getByTestId = screen.getByTestId
      })

      it('should be rendered with default value', async () => {
        expect(getByTestId('foo').textContent).toBe('Foo')
      })

      describe('then, update state', () => {
        let urlPath: string

        beforeEach(() => {
          fireEvent.click(getByTestId('foo'))
        })

        it('should be rendered with updated value', async () => {
          await waitFor(() =>
            expect(getByTestId('foo').textContent).toBe('FooFoo')
          )
          urlPath = mockRouter.asPath
        })

        describe('then, navigate (pushstate)', () => {
          beforeEach(() => {
            act(() => {
              mockRouter.push('/next')
            })
          })

          it('should be restored default value', async () => {
            expect(getByTestId('foo').textContent).toBe('Foo')
          })

          describe('then, backward', () => {
            beforeEach(() => {
              act(() => {
                mockRouter.push(urlPath) // back() is not supported yet
              })
            })

            it('should be restored updated value', async () => {
              expect(getByTestId('foo').textContent).toBe('FooFoo')
            })
          })
        })
      })
    })
  })

  describe('with querystring for SSR', () => {
    const testStringState = atom<string>({
      key: 'atom2',
      default: 'Foo',
      effects: [syncEffect({ refine: string() })],
    })

    const Child = () => {
      const [foo, setFoo] = useRecoilState(testStringState)

      return (
        <div>
          <button data-testid="foo" onClick={() => setFoo((v) => v + 'Foo')}>
            {foo}
          </button>
        </div>
      )
    }

    describe('Initial Render', () => {
      let getByTestId: (
        id: Matcher,
        options?: MatcherOptions | undefined
      ) => HTMLElement

      beforeEach(() => {
        mockRouter.isReady = true
        mockRouter.setCurrentUrl('/?atom2="Bar"')

        const screen = render(
          <App>
            <Child />
          </App>
        )
        getByTestId = screen.getByTestId
      })

      it('should be rendered with value of querystring', async () => {
        expect(getByTestId('foo').textContent).toBe('Bar')
      })

      describe('then, update state', () => {
        let urlPath: string

        beforeEach(() => {
          fireEvent.click(getByTestId('foo'))
        })

        it('should be rendered with updated value', async () => {
          await waitFor(() =>
            expect(getByTestId('foo').textContent).toBe('BarFoo')
          )
          urlPath = mockRouter.asPath
        })

        describe('then, navigate (pushstate)', () => {
          beforeEach(() => {
            act(() => {
              mockRouter.push('/next')
            })
          })

          it('should be restored default value', async () => {
            expect(getByTestId('foo').textContent).toBe('Foo')
          })

          describe('then, backward', () => {
            beforeEach(() => {
              act(() => {
                mockRouter.push(urlPath) // back() is not supported yet
              })
            })

            it('should be restored updated value', async () => {
              expect(getByTestId('foo').textContent).toBe('BarFoo')
            })
          })
        })
      })
    })
  })

  describe('with querystring for Static/SSG', () => {
    const testStringState = atom<string>({
      key: 'atom3',
      default: 'Foo',
      effects: [syncEffect({ refine: string() })],
    })

    const Child = () => {
      const [foo, setFoo] = useRecoilState(testStringState)

      return (
        <div>
          <button data-testid="foo" onClick={() => setFoo((v) => v + 'Foo')}>
            {foo}
          </button>
        </div>
      )
    }

    describe('Initial Render (router.isReady: false)', () => {
      let rerender: (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ui: ReactElement<any, string | JSXElementConstructor<any>>
      ) => void | undefined
      let getByTestId: (
        id: Matcher,
        options?: MatcherOptions | undefined
      ) => HTMLElement

      beforeEach(() => {
        mockRouter.isReady = false
        mockRouter.setCurrentUrl('/?atom3="Bar"')

        const screen = render(
          <App>
            <Child />
          </App>
        )
        rerender = screen.rerender
        getByTestId = screen.getByTestId
      })

      it('should be rendered with default', async () => {
        expect(getByTestId('foo').textContent).toBe('Foo')
      })

      describe('then, re-rendering (router.isReady: true)', () => {
        beforeEach(() => {
          act(() => {
            mockRouter.isReady = true
            rerender(
              <App>
                <Child />
              </App>
            )
          })
        })

        it('should be rendered with querystring', async () => {
          await waitFor(() =>
            expect(getByTestId('foo').textContent).toBe('Bar')
          )
        })

        describe('then, update state', () => {
          let urlPath: string

          beforeEach(() => {
            fireEvent.click(getByTestId('foo'))
          })

          it('should be rendered with updated value', async () => {
            await waitFor(() =>
              expect(getByTestId('foo').textContent).toBe('BarFoo')
            )
            urlPath = mockRouter.asPath
          })

          describe('then, navigate (pushstate)', () => {
            beforeEach(() => {
              act(() => {
                mockRouter.push('/next')
              })
            })

            it('should be restored default value', async () => {
              expect(getByTestId('foo').textContent).toBe('Foo')
            })

            describe('then, backward', () => {
              beforeEach(() => {
                act(() => {
                  mockRouter.push(urlPath) // back() is not supported yet
                })
              })

              it('should be restored updated value', async () => {
                expect(getByTestId('foo').textContent).toBe('BarFoo')
              })
            })
          })
        })
      })
    })
  })
})
