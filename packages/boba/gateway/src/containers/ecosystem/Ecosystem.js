import React, { useEffect } from 'react'
import * as S from './Ecosystem.styles'
import Button from 'components/button/Button'
import { Outlet, useNavigate, useParams } from 'react-router-dom'
import { ECOSYSTEM_CATEGORY, ROUTES_PATH } from 'util/constant'
import { PageTitle } from 'components/global/PageTitle'

const ECOSYSTEM = ({ ecosystemType }) => {
  const navigate = useNavigate();
  const params = useParams();

  useEffect(() => {
    if (!params.category) {
      navigate(`${ROUTES_PATH.ECOSYSTEM}/defi`)
    }
  }, [params, navigate, ecosystemType])

  return (
    <S.EcoSystemPageContainer>
      <PageTitle title="Ecosystem" slug="Explore our decentralized apps on Boba Network"/>

      <S.CategoryList>
        {ECOSYSTEM_CATEGORY.map((cat, i) => {
          return <Button
              key={i}
              onClick={() => {
                navigate(`${ROUTES_PATH.ECOSYSTEM}/${cat}`)
              }}
              sx={{ textTransform: 'uppercase' }}
              variant={params.category === cat ? 'contained' : 'standard'}
              color="secondary"
              size="small"
          >
            {cat}
          </Button>
        })}
      </S.CategoryList>
      <S.DividerLine />
      <S.ProjectListContainer 
        container
        spacing={{ xs: 2, md: 2 }}
        columns={{ xs: 5, sm: 13, md: 13 }}
      >
        <Outlet />
      </S.ProjectListContainer>
    </S.EcoSystemPageContainer>
  )

}


export default React.memo(ECOSYSTEM);
