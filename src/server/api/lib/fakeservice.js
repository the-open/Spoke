import { getLastMessage } from './message-sending'
import { Message, PendingMessagePart, r } from '../../models'
import { log } from '../../../lib'

// This 'fakeservice' allows for fake-sending messages
// that end up just in the db appropriately and then using sendReply() graphql
// queries for the reception (rather than a real service)

async function sendMessage(message) {
  return Message.save({ ...message,
                        send_status: 'SENT',
                        service: 'fakeservice'
                      }, { conflict: 'update' })
    .then((saveError, newMessage) => newMessage)
}

// None of the rest of this is even used for fake-service
// but *would* be used if it was actually an outside service.

async function convertMessagePartsToMessage(messageParts) {
  const firstPart = messageParts[0]
  const userNumber = firstPart.user_number
  const contactNumber = firstPart.contact_number
  const text = firstPart.service_message

  const lastMessage = await getLastMessage({
    contactNumber
  })
  return new Message({
    contact_number: contactNumber,
    user_number: userNumber,
    is_from_contact: true,
    text,
    service_response: JSON.stringify(messageParts),
    service_id: firstPart.service_id,
    assignment_id: lastMessage.assignment_id,
    service: 'fakeservice',
    send_status: 'DELIVERED'
  })
}

async function handleIncomingMessage(message) {
  const { contact_number, user_number, service_id, text } = message
  const pendingMessagePart = new PendingMessagePart({
    service: 'fakeservice',
    service_id,
    parent_id: '',
    service_message: text,
    user_number,
    contact_number
  })

  const part = await pendingMessagePart.save()
  return part.id
}

export default {
  sendMessage,
  // useless unused stubs
  convertMessagePartsToMessage,
  handleIncomingMessage
}