defmodule MattchatWeb.PageController do
  use MattchatWeb, :controller

  def index(conn, _params) do
    render conn, "index.html"
  end
end
