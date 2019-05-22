defmodule Mattchat.ChatService do
  @moduledoc """
  The Menu context.
  """

  import Ecto.Query, warn: false
  alias Mattchat.Repo

  alias Mattchat.Chat
  alias Mattchat.Channel

  def channels() do
    Repo.all(Channel)
  end

  # These should probably be in a separate layer, but I'm just jamming 'em here for now.
  def messages(args) do
    args
    |> Enum.reduce(Chat, fn
      {:order, order}, query ->
        query |> order_by({^order, :inserted_at})
      {:limit, limit}, query ->
        query |> limit(^limit)
      {:filter, filter}, query ->
        query |> filter_with(filter)
    end)
    |> preload([:user])
    |> Repo.all
  end

  def create_chat(attrs \\ %{}) do
    %Chat{}
    |> Chat.changeset(attrs)
    |> Repo.insert()
  end

  def create_channel(attrs \\ %{}) do
    %Channel{}
    |> Channel.changeset(attrs)
    |> Repo.insert()
  end

  defp filter_with(query, filter) do
    Enum.reduce(filter, query, fn
      {:channel, channel}, query ->
        from q in query, where: q.channel_name == ^channel
      {:sent_before, date}, query ->
        from q in query, where: q.inserted_at <= ^date
    end)
  end
end