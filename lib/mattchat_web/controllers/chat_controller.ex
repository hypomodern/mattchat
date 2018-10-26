defmodule MattchatWeb.ChatController do
  use MattchatWeb, :controller

  alias Mattchat.ChatService
  alias MattchatWeb.TwilioToken

  require Logger

  def index(conn, _params) do
    messages = ChatService.messages(%{
      order: :asc,
      limit: 20,
      filter: %{
        channel: "global"
      }
    })
    user = Guardian.Plug.current_resource(conn)
    tw_token = TwilioToken.for_video(user.username)
    conn
    |> assign(:auth_token, Mattchat.Accounts.access_token(user))
    |> assign(:current_user, user)
    |> assign(:messages, messages)
    |> assign(:tw_token, tw_token)
    |> render "index.html"
  end

  def test(conn, _params) do
    conn
    |> render "test.html"
  end

  defp fake_token, do: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiIsImN0eSI6InR3aWxpby1mcGE7dj0xIn0.eyJqdGkiOiJTS2QxNTQyYzg1MWZiZGNjODNkODc1ZmY1OTlmODI5YmNiLTE1NDA1NjgyNjQiLCJpc3MiOiJTS2QxNTQyYzg1MWZiZGNjODNkODc1ZmY1OTlmODI5YmNiIiwic3ViIjoiQUNlNTFhMTg3ZDM0YjZlMzE0MWExZjIwODJiMGQ2ZGRhNyIsImV4cCI6MTU0MDU3MTg2NCwiZ3JhbnRzIjp7ImlkZW50aXR5IjoidGVzdCIsInZpZGVvIjp7fX19.vti9_ZZT3ESP79IWYXBbmxFY1_YHyN6R5lUtgjPZlEE"
end