defmodule MattchatWeb.Schema do
  use Absinthe.Schema

  alias MattchatWeb.Resolvers

  import_types __MODULE__.ChatTypes

  query do
    field :messages, list_of(:chat) do
      arg :filter, :chat_filter
      arg :order, type: :sort_order, default_value: :asc
      arg :limit, :integer, default_value: 20
      resolve &Resolvers.Chat.messages/3
    end

  end


  mutation do
    # mutations
    field :create_chat, :chat do
      arg :input, non_null(:chat_input)
      resolve &Resolvers.Chat.create_chat/3
    end
  end

  @desc "An error encountered trying to persist input"
  object :input_error do
    field :key, non_null(:string)
    field :message, non_null(:string)
  end

  scalar :date do
    parse fn input ->
      with %Absinthe.Blueprint.Input.String{value: value} <- input,
      {:ok, date} <- NaiveDateTime.from_iso8601(value) do
        {:ok, date}
      else
        _ -> :error
      end
    end

    serialize fn date ->
      NaiveDateTime.to_iso8601(date)
    end
  end

  scalar :decimal do
    parse fn
      %{value: value}, _ ->
        Decimal.parse(value)
      _, _ ->
        :error
    end
    serialize &to_string/1
  end

  enum :sort_order do
    value :asc
    value :desc
  end

end