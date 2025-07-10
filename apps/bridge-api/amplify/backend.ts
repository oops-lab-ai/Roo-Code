import { defineBackend } from "@aws-amplify/backend"
import { auth } from "./auth/resource"
import { data } from "./data/resource"

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
export const backend = defineBackend({
	auth,
	data,
})

const apiStack = backend.createStack(`bridge-stack-${process.env.BUILD_ENV}`)
