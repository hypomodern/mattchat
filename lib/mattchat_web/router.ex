defmodule MattchatWeb.Router do
  use MattchatWeb, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_flash
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  pipeline :auth do
    plug Mattchat.Accounts.Pipeline
  end

  pipeline :ensure_auth do
    plug Guardian.Plug.EnsureAuthenticated, handler: SessionController
  end

  scope "/", MattchatWeb do
    pipe_through [:browser, :auth]

    get "/", PageController, :index
    post "/login", SessionController, :create
    resources "/users", UserController, only: [:create]
  end

  scope "/", MattchatWeb do
    pipe_through [:browser, :auth, :ensure_auth]

    get "/chat", ChatController, :index
    delete "/logout", SessionController, :destroy
  end

  scope "/" do
    pipe_through :api

    forward "/api", Absinthe.Plug,
      schema: MattchatWeb.Schema

    forward "/graphiql", Absinthe.Plug.GraphiQL,
      schema: MattchatWeb.Schema,
      interface: :simple
  end

  # Other scopes may use custom stacks.
  # scope "/api", MattchatWeb do
  #   pipe_through :api
  # end
end
