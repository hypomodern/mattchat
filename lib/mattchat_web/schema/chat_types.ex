defmodule MattchatWeb.Schema.ChatTypes do
  use Absinthe.Schema.Notation

  alias MattchatWeb.Resolvers

  object :chat do
    field :id, :id
    field :body, :string
    field :user_id, :string
    field :user, :user
    field :inserted_at, :date
  end

  object :user do
    field :username, :string
  end

  input_object :chat_input do
    field :body, non_null(:string)
    field :channel, non_null(:string)
    field :user_id, non_null(:string)
  end

  @desc "Filtering options for the chat list"
  input_object :chat_filter do

    @desc "In a channel"
    field :channel, non_null(:string)

    @desc "Sent before this date"
    field :sent_before, :date

    @desc "Sent after this date"
    field :sent_after, :date

  end

end