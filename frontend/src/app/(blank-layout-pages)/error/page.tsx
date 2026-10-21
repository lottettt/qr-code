import NotFound from '@views/NotFound'
import { getServerMode } from '@core/utils/serverHelpers'

const Error = async () => {
  const mode = await getServerMode()

  return <NotFound mode={mode} />
}

export default Error
