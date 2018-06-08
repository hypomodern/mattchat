defmodule MattchatWeb.ChatView do
  use MattchatWeb, :view

  def ws_url do
    System.get_env("WS_URL") || MattchatWeb.Endpoint.config(:ws_url)
  end
end
