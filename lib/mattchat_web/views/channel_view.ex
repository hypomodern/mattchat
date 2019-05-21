defmodule MattchatWeb.ChannelView do
  use MattchatWeb, :view

  def render("channel.json", %{channel: channel}) do
    %{name: channel.name}
  end
end
