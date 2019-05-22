defmodule MattchatWeb.RoomChannel do
  use MattchatWeb, :channel

  # alias MattchatWeb.Presence
  alias Mattchat.ChatService

  def join("room:" <> room_name, _params, socket) do
    messages = ChatService.messages(%{
      order: :asc,
      limit: 20,
      filter: %{
        channel: room_name
      }
    })
    messages = Enum.map(messages, fn message -> %{ username: message.user.username, body: message.body } end)

    {:ok, messages, socket}
  end

  def handle_in("new_chat_message", %{"body" => body, "channel" => channel}, socket) do
    {:ok, chat} = ChatService.create_chat(%{
      body: body,
      channel_name: channel,
      user_id: current_user(socket).id
    })

    broadcast!(socket, "new_chat_message", %{
      channel_name: channel
    })

    broadcast!(socket, "new_chat_message:" <> channel, %{
      username: current_user(socket).username,
      body: body
    })

    {:noreply, socket}
  end

  defp current_user(socket) do
    socket.assigns.current_user
  end
end